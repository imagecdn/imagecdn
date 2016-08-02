<?php

namespace AppBundle\Controller;

use Liip\ImagineBundle\Exception\Binary\Loader\NotLoadableException;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ImageController extends Controller
{
    /**
     * @Route("/v1/images/{uri}", name="images")
     */
    public function imageAction(Request $request)
    {
        $filterManager = $this->get('liip_imagine.filter.manager');
        $dataManager = $this->get('liip_imagine.data.manager');

        $height = $request->get('height', 250);
        $width = $request->get('width', 250);
        $dpr = $request->get('dpr', 250);

        $filterConfiguration = $this->get('liip_imagine.filter.configuration');
        $filterConfiguration->set('test', [
            'data_loader' => 'stream_loader',
            'filters'     => ['thumbnail' => [
                    'size' => [$height, $width],
                ],
            ],
            'post_processors' => [
                'mozjpeg' => [
                    'qual' => 80
                ],
                'pngquant' => []
            ],
        ]);

        try {
            if (!$request->has('uri')) {
                throw new Exception('No image found!');
            }
            $binary = $dataManager->find('test', urldecode($request->get('uri')));
        } catch (Exception $e) {
            throw new HttpException(503, $e->getMessage());
        } catch (NotLoadableException $e) {
            throw new NotFoundHttpException('Source image could not be found', $e);
        }

        $binary = $filterManager->applyFilter($binary, 'test', []);

        $contentLength = mb_strlen($binary->getContent(), '8bit');
        if ($contentLength === false) {
            throw new HttpException(503, 'Error occurred whilst processing image.');
        }

        $response = new Response($binary->getContent());
        $response->headers->set('Content-Type', $binary->getMimeType());
        $response->headers->set('Content-Length', $contentLength);
        $response->setPublic();
        $response->setSharedMaxAge(3600 * 72);
        $response->setMaxAge(3600 * 72);
        $response->setVary('Accept-Encoding');

        return $response;
    }
}

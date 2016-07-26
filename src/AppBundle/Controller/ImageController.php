<?php

namespace AppBundle\Controller;

use Liip\ImagineBundle\Exception\Binary\Loader\NotLoadableException;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;

class ImageController extends Controller
{
    /**
     * @Route("/", name="images")
     */
    public function imageAction(Request $request)
    {
        $filterManager = $this->get('liip_imagine.filter.manager');
        $dataManager = $this->get('liip_imagine.data.manager');

        $filterConfiguration = $this->get('liip_imagine.filter.configuration');
        $filterConfiguration->set('test', [
            'data_loader' => 'stream_loader',
            'filters'     => ['thumbnail' => [
                    'size' => [50, 50],
                ],
            ],
            'post_processors' => [
            ],
        ]);

        try {
            $url = $request->get('url', 'http://lorempixel.com/400/200/sports/1/');
            $binary = $dataManager->find('test', $url);
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

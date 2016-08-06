<?php

namespace AppBundle\DependencyInjection\Compiler;

use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Compiler\CompilerPassInterface;
use Symfony\Component\DependencyInjection\Reference;

class TransformLoaderPass implements CompilerPassInterface
{
    /**
     * @var string
     */
    const TRANSFORM_LOADER_SERVICE = 'responsive_images.transform_loader';

    /**
     * {@inheritdoc}
     *
     * @param  ContainerBuilder $container
     *
     * @return void
     */
    public function process(ContainerBuilder $container)
    {
        if (!$container->has(self::TRANSFORM_LOADER_SERVICE)) {
            return;
        }

        $transformLoaderDefinition = $container->findDefinition(self::TRANSFORM_LOADER_SERVICE);
        $transformLoaders = $container->findTaggedServiceIds(self::TRANSFORM_LOADER_SERVICE);
        foreach ($transformLoaders as $id => $tags) {
            $transformLoaderDefinition->addMethodCall('addTransform', [new Reference($id)]);
        }
    }
}
